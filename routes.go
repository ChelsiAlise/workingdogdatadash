package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"appengine"
)

var apiPaths = make(map[string]bool)

// mux for routes that should be served behind authorization
var authRequiredMux = http.NewServeMux()

// TODO: login, have "/" be the homepage
func init() {
	// set up http handlers
	http.HandleFunc("/", RootHandler)
	http.HandleFunc("/login", RootHandler)
	// we don't want anyone crawling our site
	http.HandleFunc("/robots.txt",
		func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("User-agent: *\nDisallow: /"))
		})
	// health checks
	http.HandleFunc("/_ah/health", healthCheckHandler)
	// api routes
	AddApi("data/upload", dataUploadHandler)
	AddApi("data/blob", dataBlobHandler)
	AddApi("data/days", dataDaysHandler)
	AddApi("data/dogs", dataDogsHandler)
	AddApi("data/filtered/blob", dataFilteredBlobHandler)
	AddApi("data/filtered/days", dataFilteredDaysHandler)
	AddApi("data/filtered/dogs", dataFilteredDogsHandler)
}

func AddApi(path string, handler http.HandlerFunc) {
	authRequiredMux.HandleFunc("/api/"+path, handler)
	authRequiredMux.HandleFunc("/api/cached/"+path, GetApiCached)
	apiPaths[path] = true
}

// TODO: remove encrypt and decrypt
// ... there is a lot wrong with this, but it will serve POC behind https
// fine
func encrypt(keyString, textString string) string {
	key := []byte(keyString)
	text := []byte(textString)
	block, _ := aes.NewCipher(key)
	ciphertext := make([]byte, aes.BlockSize+len(text))
	iv := ciphertext[:aes.BlockSize]
	io.ReadFull(rand.Reader, iv)
	cfb := cipher.NewCFBEncrypter(block, iv)
	cfb.XORKeyStream(ciphertext[aes.BlockSize:], text)
	b := base64.StdEncoding.EncodeToString(ciphertext)
	return b
}

func decrypt(keyString, textString string) string {
	key := []byte(keyString)
	textDecoded, _ := base64.StdEncoding.DecodeString(textString)
	text := []byte(textDecoded)
	block, _ := aes.NewCipher(key)
	iv := text[:aes.BlockSize]
	text = text[aes.BlockSize:]
	cfb := cipher.NewCFBDecrypter(block, iv)
	cfb.XORKeyStream(text, text)
	return string(text)
}

// RootHandler handles authorization and login
func RootHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: this is horrible.
	AUTH_COOKIE_NAME := "auth"
	// handle login
	if r.URL.Path == "/login" {
		if r.Method == "GET" {
			http.ServeFile(w, r, "static/login.html")
		} else if r.Method == "POST" {
			r.ParseForm()
			username := r.FormValue("username")
			password := r.FormValue("password")
			if userPassword, ok := users[username]; !ok || userPassword != password {
				http.Redirect(w, r, "/login?retry=true", 303)
				return
			}
			cookie := http.Cookie{
				Name:     AUTH_COOKIE_NAME,
				Value:    encrypt(uploadKey, username+"\r"+password),
				Secure:   true,
				HttpOnly: true,
				Path:     "/",
				Expires:  time.Now().Add(time.Hour * 24 * 7 * 3),
			}
			http.SetCookie(w, &cookie)
			http.Redirect(w, r, "/", 303)
		}
		return
	}
	// check authorization
	// TODO: _please_ replace this with something more secure
	// unfortunately we cannot use Oauth so...
	c, err := r.Cookie(AUTH_COOKIE_NAME)
	if err != nil {
		http.Redirect(w, r, "/login", 303)
		return
	}
	str := decrypt(uploadKey, c.Value)
	strs := strings.Split(str, "\r")
	if len(strs) < 2 {
		http.Redirect(w, r, "/login", 303)
		return
	}
	username := strs[0]
	password := strs[1]
	if userPassword, ok := users[username]; !ok || userPassword != password {
		http.Redirect(w, r, "/login", 303)
		return
	}
	// at this point we have a cookie and it matches, so handle normally
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "static/index.html")
		return
	}
	if r.URL.Path == "/customChart.html" {
		http.ServeFile(w, r, "static/customChart.html")
		return
	}
	authRequiredMux.ServeHTTP(w, r)
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}

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
}

func dataBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}

func dataDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}

func dataDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}

func dataFilteredBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}

func dataFilteredDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}

func dataFilteredDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	data, err := GetDataFilteredDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(data)
}
