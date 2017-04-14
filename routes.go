/*
	this is the heart of the backend, it contains all
	api routes and initialization
*/

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

/* route prefixes */

const baseAPIPrefix = "/api/"
const cachedAPIPrefix = "/api/cached/"
const uploadAPIPrefix = "/api/upload/"
const adminAPIPrefix = "/api/admin/"

// the name of the user login auth cookie
const authCookieName = "auth"

// set of all api routes that should be cached
var cachedAPIPaths = make(map[string]bool)

// mux for apis
var baseAPIMux = http.NewServeMux()

// mux for admin apis
var adminAPIMux = http.NewServeMux()

// mux for upload apis
var uploadAPIMux = http.NewServeMux()

// TODO: have "/" be the homepage (?)
func init() {
	// set up http handlers
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/login", loginHandler)

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

	// NOTE: routes below are not in the main router, and are only served
	// behind the appropriate authorization in the root handler (/)

	// api routes
	// dogs and their minute totals (initial dataset + outcomes)
	addCachedAPI("data/blob", dataBlobHandler)
	addCachedAPI("data/days", dataDaysHandler)
	addCachedAPI("data/dogs", dataDogsHandler)
	addCachedAPI("data/filtered/blob", dataFilteredBlobHandler)
	addCachedAPI("data/filtered/days", dataFilteredDaysHandler)
	addCachedAPI("data/filtered/dogs", dataFilteredDogsHandler)

	// data upload api (dogs, minute totals, outcomes)
	addUploadAPI("data", dataUploadHandler)
	// user bootstrap api
	addUploadAPI("users", userUploadHandler)

	// admin apis
	addAdminAPI("users/delete", deleteUserHandler)
	addAdminAPI("users/add", addUserHandler)
	addAdminAPI("users/update", updateUserHandler)
	addAdminAPI("users/list", listUsersHandler)
}

// addAPI registers a basic API handler
func addAPI(subPath string, handler http.HandlerFunc) {
	baseAPIMux.HandleFunc(baseAPIPrefix+subPath, handler)
}

// addCachedAPI registers an API route and handler to be cached
func addCachedAPI(subPath string, handler http.HandlerFunc) {
	addAPI(subPath, handler)
	baseAPIMux.HandleFunc(cachedAPIPrefix+subPath, getAPICached)
	cachedAPIPaths[baseAPIPrefix+subPath] = true
}

// addAdminAPI registers an API route and handler that require administrator
// authorization
func addAdminAPI(subPath string, handler http.HandlerFunc) {
	adminAPIMux.HandleFunc(adminAPIPrefix+subPath, handler)
}

// addUploadAPI registers an API route and handler that require upload-key
// authorization
func addUploadAPI(subPath string, handler http.HandlerFunc) {
	uploadAPIMux.HandleFunc(uploadAPIPrefix+subPath, handler)
}

// rootHandler handles authorization and forwarding authorized requests
// to the relevant request handler
func rootHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)

	// upload apis are seperate from auth required
	if strings.HasPrefix(r.URL.Path, uploadAPIPrefix) {
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
		// handle upload apis
		uploadAPIMux.ServeHTTP(w, r)
		// flush the cache after the data has been added
		dataModifiedHook(ctx)
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

	// NOTE from this point the user has authorization

	// special case / to the index
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "static/index.html")
		return
	}

	// handle administrator apis
	if strings.HasPrefix(r.URL.Path, adminAPIPrefix) {
		if !userInfo.IsAdmin {
			http.Error(w, "You are not an administrator.", http.StatusUnauthorized)
			return
		}
		adminAPIMux.ServeHTTP(w, r)
		return
	}

	// handle remaining apis
	baseAPIMux.ServeHTTP(w, r)
}

// loginHandler handles /login ..
func loginHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	// serve the page to get, otherwise handle attempts to login
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
}

// dataUploadHandler processes authenticated requests
// to upload a json DataBlob
func dataUploadHandler(w http.ResponseWriter, r *http.Request) {
	// parse and import the data
	ctx := makeContext(r)
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
	ctx := makeContext(r)
	data, err := getDataBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataDaysHandler returns all of the Day objects
func dataDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	data, err := getDataDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataDogsHandler returns all of the Dog objects
func dataDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	data, err := getDataDogs(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredBlobHandler returns a blob filtered by FilterThreshold
func dataFilteredBlobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	data, err := getDataFilteredBlob(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredDaysHandler returns days filtered by FilterThreshold
func dataFilteredDaysHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	data, err := getDataFilteredDays(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch data.", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// dataFilteredDogsHandler returns dogs filtered by FilterThreshold
func dataFilteredDogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
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
	// parse and import the data
	ctx := makeContext(r)
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

// deleteUserHandler allows authenticated admins to delete users
func deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	r.ParseForm()
	username := r.FormValue("username")
	err := deleteUser(ctx, username)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to delete user: %v", err), http.StatusInternalServerError)
	}
}

// addUserHandler allows authenticated admins to add users
func addUserHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	isAdmin := r.FormValue("is_admin") == ""
	passwordHash := userhash(username, password)
	user := &User{
		Username:     username,
		PasswordHash: passwordHash,
		IsAdmin:      isAdmin,
	}
	_, err := addUser(ctx, user)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to add user: %v", err), http.StatusInternalServerError)
	}
}

// updateUserHandler allows authenticated admins to update users
func updateUserHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	isAdmin := r.FormValue("is_admin") == "true"
	passwordHash := userhash(username, password)
	user := &User{
		Username:     username,
		PasswordHash: passwordHash,
		IsAdmin:      isAdmin,
	}
	err := deleteUser(ctx, username)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to update user: %v", err), http.StatusInternalServerError)
		return
	}
	_, err = addUser(ctx, user)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to update user: %v", err), http.StatusInternalServerError)
	}
}

// listUsersHandler returns a list of serialized users (With passwords scrubbed)
// to administrators using the api
func listUsersHandler(w http.ResponseWriter, r *http.Request) {
	ctx := makeContext(r)
	users, err := getUsers(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to list users: %v", err), http.StatusInternalServerError)
		return
	}
	// blank out passwords
	for _, user := range users {
		user.PasswordHash = ""
	}
	json.NewEncoder(w).Encode(users)
}
