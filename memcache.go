/*
	this file contains all code for interacting with memecache
*/

package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"appengine"
	"appengine/memcache"
)

// the last time the datastore was updated
// this allows us to crudley cache results until dataModifiedHook is called
var lastModifiedTime = time.Now()

// dataModifiedHook needs to be called whenever something in the DB changes
func dataModifiedHook(ctx appengine.Context) {
	memcache.Flush(ctx)
	lastModifiedTime = time.Now()
}

// getUserCached fetches UserInfo for a user, attempting to use
// memcache before the database and to insert users into memcache
// when the database is used
func getUserCached(ctx appengine.Context, username string) (u *User, err error) {
	// check memcache
	userCacheKey := "user/" + username
	item, err := memcache.Get(ctx, userCacheKey)
	if err == nil {
		u = new(User)
		err = json.Unmarshal(item.Value, u)
		if err == nil {
			return u, err
		}
	}
	// try from DB
	u, err = getUser(ctx, username)
	if err != nil {
		return nil, err
	}
	// cache if we got a result from the DB
	b, err := json.Marshal(u)
	if err != nil {
		ctx.Errorf("error marshalling user: %v", err)
	} else {
		item := &memcache.Item{
			Key:   userCacheKey,
			Value: b,
		}
		if err := memcache.Set(ctx, item); err != nil {
			ctx.Errorf("error setting user in memcache: %v", err)
		}
	}
	return u, nil
}

type CacheResponseWriter struct {
	responseWriter http.ResponseWriter
	code           int
	buffer         *bytes.Buffer
	gzipWriter     *gzip.Writer
	multiWriter    io.Writer
}

func NewCacheResponseWriter(w http.ResponseWriter) *CacheResponseWriter {
	buffer := bytes.NewBuffer([]byte{})
	gzipWriter := gzip.NewWriter(buffer)
	multiWriter := io.MultiWriter(w, gzipWriter)
	return &CacheResponseWriter{
		responseWriter: w,
		code:           http.StatusOK,
		buffer:         buffer,
		gzipWriter:     gzipWriter,
		multiWriter:    multiWriter,
	}
}

func (c *CacheResponseWriter) Header() http.Header {
	return c.responseWriter.Header()
}

func (c *CacheResponseWriter) Write(bytes []byte) (int, error) {
	return c.multiWriter.Write(bytes)
}

func (c *CacheResponseWriter) WriteHeader(code int) {
	c.code = code
	c.responseWriter.WriteHeader(code)
}

func (c *CacheResponseWriter) Code() int {
	return c.code
}

func (c *CacheResponseWriter) Bytes() []byte {
	c.gzipWriter.Flush()
	c.gzipWriter.Close()
	return c.buffer.Bytes()
}

// ensure CacheResponseWriter implements http.ResponseWriter
var _ http.ResponseWriter = &CacheResponseWriter{}

type cacheEntity struct {
	Value []byte
}

var _ http.ResponseWriter = (*CacheResponseWriter)(nil)

// getAPICached fetches api results for a cached api route,
// attempting to use memcache before the live results
// results are inserted into memcache when the live results are used
func getAPICached(w http.ResponseWriter, r *http.Request) {
	realPath := baseAPIPrefix + strings.TrimPrefix(r.URL.Path, cachedAPIPrefix)
	// make sure the api to serve should be cached
	if _, ok := cachedAPIPaths[realPath]; !ok {
		http.Error(w, "There is no such cached api route.",
			http.StatusInternalServerError)
		return
	}

	// convert last modified time to http.TimeFormat
	lmt := lastModifiedTime.Format(http.TimeFormat)

	// set cache headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "private, max-age=0, must-revalidate")
	w.Header().Set("Last-Modified", lmt)

	// if the browser provides "If-Modified-Since" header,
	// and it matches Last-Modified time, then return 304
	ims := r.Header.Get("If-Modified-Since")
	if ims == lmt {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	// otherwise serve the result
	ctx := makeContext(r)
	uri := r.URL.RequestURI()
	// attempt to serve from memcached
	{
		item, err := memcache.Get(ctx, uri)
		if err == nil {
			reader, err := gzip.NewReader(bytes.NewReader(item.Value))
			defer reader.Close()
			if err != nil {
				ctx.Errorf("error decompressing cache value, err: %v", err)
			} else {
				io.Copy(w, reader)
			}
			return
		}
	}

	// fallback to serving from the un-cached api,
	// and then cache the results in memcache
	ctx.Infof("Attempting to serve from live API result")
	r.URL.Path = realPath
	cacheResponseWriter := NewCacheResponseWriter(w)
	http.DefaultServeMux.ServeHTTP(cacheResponseWriter, r)

	// check the status code and cache the data if 200 (ok)
	if cacheResponseWriter.Code() == http.StatusOK {
		b := cacheResponseWriter.Bytes()
		{
			item := &memcache.Item{
				Key:   uri,
				Value: b,
			}
			if err := memcache.Set(ctx, item); err != nil {
				ctx.Errorf("error setting item: %v", err)
			}
		}

	} else {
		ctx.Errorf("cache response writer code is not http.StatusOK: %v", cacheResponseWriter.Code())
	}
}
