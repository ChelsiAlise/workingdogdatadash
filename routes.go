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
	// user bootstrap api
	http.HandleFunc("/api/users/upload", userUploadHandler)
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

func userhash(username, password string) string {
	h := sha256.New()
	io.WriteString(h, salt1)
	io.WriteString(h, username)
	io.WriteString(h, salt2)
	io.WriteString(h, password)
	return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%x", h.Sum(nil))))
}

// RootHandler handles authorization and login
func RootHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	AUTH_COOKIE_NAME := "auth"
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
			userInfo, err := GetUserCached(ctx, username)
			if err != nil || userInfo.PasswordHash != passwordHash {
				ctx.Infof("Failed to match hashes (login)! %s %s", userInfo.PasswordHash, passwordHash)
				http.Redirect(w, r, "/login?retry=true", 303)
				return
			}
			cookie := http.Cookie{
				Name:     AUTH_COOKIE_NAME,
				Value:    encrypt(uploadKey, username+"\r"+passwordHash),
				Secure:   true,
				HttpOnly: true,
				Path:     "/",
				Expires:  time.Now().Add(time.Hour * 24 * 7 * 3),
			}
			ctx.Infof("All good.")
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
	passwordHash := strs[1]
	// check memcache first then fallback to DB and compare
	userInfo, err := GetUserCached(ctx, username)
	if err != nil || userInfo.PasswordHash != passwordHash {
		http.Redirect(w, r, "/login?retry=true", 303)
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
		_, err = AddDataDog(ctx, dog)
		ctx.Infof("Dog: %s, %v", dog.Name, err)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
	for _, day := range data.Days {
		_, err = AddDataDay(ctx, day)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
}

func dataBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func dataDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func dataDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func dataFilteredBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataFilteredBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func dataFilteredDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataFilteredDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func dataFilteredDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	data, err := GetDataFilteredDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func userUploadHandler(w http.ResponseWriter, r *http.Request) {
	if key, ok := r.Header["Upload-Key"]; ok {
		if len(key) != 1 || key[0] != uploadKey {
			http.Error(w, "Invalid authorization key.", http.StatusUnauthorized)
			return
		}
	} else {
		http.Error(w, "Invalid request.", http.StatusUnauthorized)
		return
	}
	ctx := appengine.Timeout(appengine.NewContext(r), 30*time.Second)
	ctx.Infof("upload request!")
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
		_, err = AddUser(ctx, user)
		if err != nil {
			http.Error(w, "Failed to handle import! "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
}
