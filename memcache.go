package main

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"time"

	"appengine"
	"appengine/memcache"
)

//TODO: What should this be?
var CacheDuration time.Duration = time.Hour * 24

type CacheResponseWriter struct {
	writer     http.ResponseWriter
	code       int
	buffer     *bytes.Buffer
	gzipWriter *gzip.Writer
}

func NewCacheResponseWriter(w http.ResponseWriter) *CacheResponseWriter {
	buffer := bytes.NewBuffer([]byte{})
	return &CacheResponseWriter{
		writer:     w,
		code:       http.StatusOK,
		buffer:     buffer,
		gzipWriter: gzip.NewWriter(buffer),
	}
}

func (c *CacheResponseWriter) Header() http.Header {
	return c.Header()
}

func (c *CacheResponseWriter) Write(bytes []byte) (int, error) {
	i, err := c.writer.Write(bytes)
	if err == nil {
		c.gzipWriter.Write(bytes)
	}
	return i, err
}

func (c *CacheResponseWriter) WriteHeader(code int) {
	c.code = code
	c.writer.WriteHeader(code)
}

// ensure CacheResponseWriter implements http.ResponseWriter
var _ http.ResponseWriter = &CacheResponseWriter{}

func (c *CacheResponseWriter) Code() int {
	return c.code
}

func (c *CacheResponseWriter) Bytes() []byte {
	c.gzipWriter.Flush()
	c.gzipWriter.Close()
	return c.buffer.Bytes()
}

func GetApiCached(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	uri := r.URL.RequestURI()
	item, err := memcache.Get(ctx, uri)
	if err == nil {
		reader, err := gzip.NewReader(bytes.NewReader(item.Value))
		defer reader.Close()
		if err != nil {
			ctx.Errorf("error decompressing cache value, err: %v", err)
		} else {
			io.Copy(w, reader)
			return
		}
	}
	realPath := "/api/" + strings.TrimPrefix(r.URL.Path, "/api/cached/")
	r.URL.Path = realPath
	handler, _ := http.DefaultServeMux.Handler(r)
	cacheResponseWriter := NewCacheResponseWriter(w)
	handler.ServeHTTP(cacheResponseWriter, r)
	if cacheResponseWriter.Code() == http.StatusOK {
		item := &memcache.Item{
			Key:        uri,
			Value:      cacheResponseWriter.Bytes(),
			Expiration: CacheDuration,
		}
		if err := memcache.Set(ctx, item); err != nil {
			ctx.Errorf("error setting item: %v", err)
		}
	} else {
		ctx.Errorf("cache code is not http.StatusOK: %v", cacheResponseWriter.Code())
	}
}
