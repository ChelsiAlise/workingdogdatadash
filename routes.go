/*
	this is the heart of the backend, it contains all
	api routes and initialization
*/

package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"appengine"
)

// the name of the user login auth cookie
const authCookieName = "auth"

// set of all api routes that should be cached
var cachedAPIPaths = make(map[string]bool)

// mux for routes that should be served behind account authorization
var authRequiredMux = http.NewServeMux()

// mux for routes that should be served behind uploadKey authorization
var keyRequiredMux = http.NewServeMux()

// TODO: have "/" be the homepage (?)
func init() {
	// set up http handlers
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/login", rootHandler)

	// we don't want anyone crawling our site
	http.HandleFunc("/robots.txt",
		func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprint(w, "User-agent: *\nDisallow: /")
		})

	// handle appengine health checks
	http.HandleFunc("/_ah/health",
		func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprint(w, "ok")
		})

	// api routes
	// dogs and their minute totals (initial dataset + outcomes)
	addCachedAPI("data/blob", dataBlobHandler)
	addCachedAPI("data/days", dataDaysHandler)
	addCachedAPI("data/dogs", dataDogsHandler)
	addCachedAPI("data/filtered/blob", dataFilteredBlobHandler)
	addCachedAPI("data/filtered/days", dataFilteredDaysHandler)
	addCachedAPI("data/filtered/dogs", dataFilteredDogsHandler)

	// data upload api (dogs, minute totals, outcomes)
	keyRequiredMux.HandleFunc("/api/upload/data", dataUploadHandler)
	// user bootstrap api
	keyRequiredMux.HandleFunc("/api/upload/users", userUploadHandler)
}

// addCachedAPI registers an api route and handler to be cached
func addCachedAPI(path string, handler http.HandlerFunc) {
	authRequiredMux.HandleFunc("/api/"+path, handler)
	authRequiredMux.HandleFunc("/api/cached/"+path, getApiCached)
	cachedAPIPaths["/api/"+path] = true
}

// AES encrypt
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

// AES decrypt
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

// SHA256 hash with two salts
// Note: using the user name also prevents rainbow tables
// returns Base-64(SHA-256(salt1 + username + salt2 + password))
func userhash(username, password string) string {
	h := sha256.New()
	io.WriteString(h, salt1)
	io.WriteString(h, username)
	io.WriteString(h, salt2)
	io.WriteString(h, password)
	return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%x", h.Sum(nil))))
}

// rootHandler handles authorization and login
func rootHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)

	// upload apis are seperate from auth required
	if strings.HasPrefix(r.URL.Path, "/api/upload") {
		// handle upload apis
		keyRequiredMux.ServeHTTP(w, r)
		// flush the cache after the data has been added
		dataModifiedHook(ctx)
		return
	}

	// handle apis that require auth, and redirect to login if necessary
	// handle login
	if r.URL.Path == "/login" {
		if r.Method == "GET" {
			http.ServeFile(w, r, "static/login.html")

		} else if r.Method == "POST" {
			r.ParseForm()
			username := r.FormValue("username")
			password := r.FormValue("password")
			passwordHash := userhash(username, password)

			// get info from DB and compare
			userInfo, err := getUserCached(ctx, username)
			if err != nil || userInfo.PasswordHash != passwordHash {
				ctx.Infof("Failed to match hashes (login)! %s %s", userInfo.PasswordHash, passwordHash)
				http.Redirect(w, r, "/login?retry=true", 303)
				return
			}
			cookie := http.Cookie{
				Name:     authCookieName,
				Value:    encrypt(uploadKey, username+"\r"+passwordHash),
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
	c, err := r.Cookie(authCookieName)
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
	passwordHash := strs[1]

	// check memcache first then fallback to DB and compare
	userInfo, err := getUserCached(ctx, username)
	if err != nil || userInfo.PasswordHash != passwordHash {
		http.Redirect(w, r, "/login?retry=true", 303)
		return
	}

	// at this point we have a cookie and it matches, so handle normally
	// special case / to the index
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "static/index.html")
		return
	}

	// handle remaining apis
	authRequiredMux.ServeHTTP(w, r)
}

// dataUploadHandler processes authenticated requests
// to upload a json DataBlob
func dataUploadHandler(w http.ResponseWriter, r *http.Request) {
	// ensure upload key exists and is correct
	if key, ok := r.Header["Upload-Key"]; ok {
		if len(key) != 1 || key[0] != uploadKey {
			http.Error(w, "Invalid authorization key.", http.StatusUnauthorized)
			return
		}
	} else {
		http.Error(w, "Invalid request.", http.StatusUnauthorized)
		return
	}
	// parse and import the data
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	ctx.Infof("upload request!")
	decoder := json.NewDecoder(r.Body)
	var data DataBlob
	err := decoder.Decode(&data)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Failed to handle import! "+err.Error(),
			http.StatusInternalServerError)
		return
	}
	ctx.Infof("dogs: %d", len(data.Dogs))
	if len(data.Dogs) < 1 {
		http.Error(w, "Failed to handle import! (no dogs!)",
			http.StatusInternalServerError)
	}
	for _, dog := range data.Dogs {
		_, err = addDataDog(ctx, dog)
		ctx.Infof("Dog: %s, %v", dog.Name, err)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
	for _, day := range data.Days {
		_, err = addDataDay(ctx, day)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
}

// dataBlobHandler returns the DataBlob
func dataBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataDaysHandler returns all of the Day objects
func dataDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataDogsHandler returns all of the Dog objects
func dataDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredBlobHandler returns a blob filtered by FilterThreshold
func dataFilteredBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataFilteredBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredDaysHandler returns days filtered by FilterThreshold
func dataFilteredDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataFilteredDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredDogsHandler returns dogs filtered by FilterThreshold
func dataFilteredDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := getDataFilteredDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// userUploadHandler processes authenticated (by uploadKey)
// requests to add users
func userUploadHandler(w http.ResponseWriter, r *http.Request) {
	// ensure upload key exists and is correct
	if key, ok := r.Header["Upload-Key"]; ok {
		if len(key) != 1 || key[0] != uploadKey {
			http.Error(w, "Invalid authorization key.", http.StatusUnauthorized)
			return
		}
	} else {
		http.Error(w, "Invalid request.", http.StatusUnauthorized)
		return
	}
	// parse and import the data
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	ctx.Infof("upload request! (user)")
	decoder := json.NewDecoder(r.Body)
	var users []*User
	err := decoder.Decode(&users)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Failed to handle import! "+err.Error(),
			http.StatusInternalServerError)
		return
	}
	for _, user := range users {
		_, err = addUser(ctx, user)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
}
