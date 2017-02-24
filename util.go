package main

import "net/http"

type DiscardResponseWriter struct {
	headers map[string][]string
***REMOVED***

func NewDiscardResponseWriter() *DiscardResponseWriter {
	return &DiscardResponseWriter{
		headers: make(map[string][]string),
	}
***REMOVED***

func (d *DiscardResponseWriter) Header() http.Header {
	return d.headers
***REMOVED***

func (d *DiscardResponseWriter) Write(bytes []byte) (int, error) {
	return len(bytes), nil
***REMOVED***

func (d *DiscardResponseWriter) WriteHeader(code int) {
***REMOVED***

// ensure DiscardResponseWriter implements http.ResponseWriter
var _ http.ResponseWriter = &DiscardResponseWriter{}
