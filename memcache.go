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
	"appengine/datastore"
	"appengine/memcache"
)

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
			Key:        userCacheKey,
			Value:      b,
			Expiration: CacheDuration,
		}
		if err := memcache.Set(ctx, item); err != nil {
			ctx.Errorf("error setting user in memcache: %v", err)
		}
	}
	return u, nil
}

// TODO: What should this be?
var CacheDuration time.Duration = time.Hour * 24

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

// getApiCached fetches api results for a cached api route,
// attempting to use  memcache before the database
// results are inserted into memcache when the database is used
func getApiCached(w http.ResponseWriter, r *http.Request) {
	realPath := "/api/" + strings.TrimPrefix(r.URL.Path, "/api/cached/")
	// make sure the api to serve should be cached
	if _, ok := cachedApiPaths[realPath]; !ok {
		http.Error(w, "There is no such cached api route.",
			http.StatusInternalServerError)
		return
	}
	// TODO: expire database cache automatically
	ctx := appengine.NewContext(r)
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
				w.Header().Set("Content-Type", "application/json")
				io.Copy(w, reader)
			}
			return
		}
	}
	// attempt to serve from db
	{
		ctx.Infof("Attempting to serve from DB")
		key := datastore.NewKey(ctx, "Cache", uri, 0, nil)
		entity := cacheEntity{}
		err := datastore.Get(ctx, key, &entity)
		if err == nil {
			// put into memcache from DB
			item := &memcache.Item{
				Key:        uri,
				Value:      entity.Value,
				Expiration: CacheDuration,
			}
			if err := memcache.Set(ctx, item); err != nil {
				ctx.Errorf("error setting item: %v", err)
			}
			reader, err := gzip.NewReader(bytes.NewReader(entity.Value))
			defer reader.Close()
			if err != nil {
				ctx.Errorf("error decompressing cache value, err: %v", err)
			} else {
				w.Header().Set("Content-Type", "application/json")
				io.Copy(w, reader)
			}
			return
		}
	}
	ctx.Infof("Attempting to serve from live API result")
	// otherwise serve from un-cached api, and then cache the results
	r.URL.Path = realPath
	cacheResponseWriter := NewCacheResponseWriter(w)
	authRequiredMux.ServeHTTP(cacheResponseWriter, r)
	// check the status code and cache the data if 200
	if cacheResponseWriter.Code() == http.StatusOK {
		b := cacheResponseWriter.Bytes()
		{
			item := &memcache.Item{
				Key:        uri,
				Value:      b,
				Expiration: CacheDuration,
			}
			if err := memcache.Set(ctx, item); err != nil {
				ctx.Errorf("error setting item: %v", err)
			}
		}
		// also cache in DB
		key := datastore.NewKey(ctx, "Cache", uri, 0, nil)
		key, err := datastore.Put(ctx, key, &cacheEntity{b})
		if err != nil {
			ctx.Errorf("datastoredb: could not put Cache: %v", err)
		}
	} else {
		ctx.Errorf("cache response writer code is not http.StatusOK: %v", cacheResponseWriter.Code())
	}
}
