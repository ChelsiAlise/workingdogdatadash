package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"appengine"
)

// TODO: login, have "/" be the homepage
func init() {
	// set up http handlers
	http.HandleFunc("/", handler)
	// we don't want anyone crawling our site
	http.HandleFunc("/robots.txt",
		func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("User-agent: *\nDisallow: /"))
		})
	// health checks
	http.HandleFunc("/_ah/health", healthCheckHandler)
	// api routes
	http.HandleFunc("/api/data/upload", dataUploadHandler)
	http.HandleFunc("/api/data/blob", dataBlobHandler)
	http.HandleFunc("/api/data/days", dataDaysHandler)
	http.HandleFunc("/api/data/dogs", dataDogsHandler)
	http.HandleFunc("/api/data/filtered/blob", dataFilteredBlobHandler)
	http.HandleFunc("/api/data/filtered/days", dataFilteredDaysHandler)
	http.HandleFunc("/api/data/filtered/dogs", dataFilteredDogsHandler)
***REMOVED***

func handler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprint(w, "Hello world!")
***REMOVED***

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
***REMOVED***

func dataUploadHandler(w http.ResponseWriter, r *http.Request) {
	if key, ok := r.Header["Upload-Key"]; ok {
		if len(key) != 1 || key[0] != uploadKey {
			http.Error(w, "Invalid authorization key.", http.StatusUnauthorized)
			return
		}
	} else {
		http.Error(w, "Invalid request.", http.StatusUnauthorized)
		return
	}
	ctx := appengine.NewContext(r)
	decoder := json.NewDecoder(r.Body)
	var data DataBlob
	err := decoder.Decode(&data)
	defer r.Body.Close()
	if err != nil {
		log.Println("Failed to handle import!")
		return
	}
	for _, dog := range data.Dogs {
		AddDataDog(ctx, dog)
	}
	for _, day := range data.Days {
		AddDataDay(ctx, day)
	}
***REMOVED***

func dataBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***

func dataDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***

func dataDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***

func dataFilteredBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***

func dataFilteredDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***

func dataFilteredDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
***REMOVED***
