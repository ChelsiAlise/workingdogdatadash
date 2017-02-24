package main

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"time"

	"appengine"
	"appengine/datastore"
	"appengine/memcache"
)

//TODO: What should this be?
var CacheDuration time.Duration = time.Hour * 24

type CacheResponseWriter struct {
	responseWriter http.ResponseWriter
	code           int
	buffer         *bytes.Buffer
	gzipWriter     *gzip.Writer
	multiWriter    io.Writer
***REMOVED***

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
***REMOVED***

func (c *CacheResponseWriter) Header() http.Header {
	return c.responseWriter.Header()
***REMOVED***

func (c *CacheResponseWriter) Write(bytes []byte) (int, error) {
	return c.multiWriter.Write(bytes)
***REMOVED***

func (c *CacheResponseWriter) WriteHeader(code int) {
	c.code = code
	c.responseWriter.WriteHeader(code)
***REMOVED***

func (c *CacheResponseWriter) Code() int {
	return c.code
***REMOVED***

func (c *CacheResponseWriter) Bytes() []byte {
	c.gzipWriter.Flush()
	c.gzipWriter.Close()
	return c.buffer.Bytes()
***REMOVED***

// ensure CacheResponseWriter implements http.ResponseWriter
var _ http.ResponseWriter = &CacheResponseWriter{}

type cacheEntity struct {
	Value []byte
***REMOVED***

var _ http.ResponseWriter = (*CacheResponseWriter)(nil)

func GetApiCached(w http.ResponseWriter, r *http.Request) {
	// TODO: expire database cache
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
	// otherwise serve from un-cached api, and then cache the results
	realPath := "/api/" + strings.TrimPrefix(r.URL.Path, "/api/cached/")
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
		ctx.Errorf("cache code is not http.StatusOK: %v", cacheResponseWriter.Code())
	}
***REMOVED***
