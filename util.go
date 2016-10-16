package main

import "net/http"

type DiscardResponseWriter struct {
	headers map[string][]string
}

func NewDiscardResponseWriter() *DiscardResponseWriter {
	return &DiscardResponseWriter{
		headers: make(map[string][]string),
	}
}

func (d *DiscardResponseWriter) Header() http.Header {
	return d.headers
}

func (d *DiscardResponseWriter) Write(bytes []byte) (int, error) {
	return len(bytes), nil
}

func (d *DiscardResponseWriter) WriteHeader(code int) {
}

// ensure DiscardResponseWriter implements http.ResponseWriter
var _ http.ResponseWriter = &DiscardResponseWriter{}
