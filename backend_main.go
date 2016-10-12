package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"appengine"
)

func init() {
	// set up http handlers
	http.HandleFunc("/", handle)
	http.HandleFunc("/robots.txt",
		func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("User-agent: *\nDisallow: /"))
		})
	http.HandleFunc("/_ah/health", healthCheckHandler)
	http.HandleFunc("/api/data/upload", uploadHandler)
	http.HandleFunc("/api/data/blob", blobHandler)
}

func handle(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprint(w, "Hello world!")
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
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
		AddDog(ctx, dog)
	}
	for _, day := range data.Days {
		AddDay(ctx, day)
	}
}

func blobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	var data DataBlob
	dogs, err := GetAllDogs(ctx)
	if err != nil {
		log.Println("Failed to get dogs!")
		return
	}
	data.Dogs = dogs
	days, err := GetAllDays(ctx)
	if err != nil {
		log.Println("Failed to get days!")
		return
	}
	data.Days = days
	json.NewEncoder(w).Encode(data)
}
