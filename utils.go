/*
   this file contains small common utilities used by the application server
*/

package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"time"

	"appengine"
)

// AES encrypt then base64 encode
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

// base64 decode then AES decrypt
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
// Note: using the user name also prevents feasible rainbow tables
// returns Base-64(SHA-256(salt1 + username + salt2 + password))
func userhash(username, password string) string {
	h := sha256.New()
	io.WriteString(h, salt1)
	io.WriteString(h, username)
	io.WriteString(h, salt2)
	io.WriteString(h, password)
	return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%x", h.Sum(nil))))
}

// makeContext creates and returns our default appengine context settings
func makeContext(r *http.Request) appengine.Context {
	return appengine.Timeout(appengine.NewContext(r), 30*time.Second)
}
