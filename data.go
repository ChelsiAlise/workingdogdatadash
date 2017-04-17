/*
	This file contains the data structures used to
	store and serialize data
*/

package main

// User represents an application user in the datastore
type User struct {
	IsAdmin      bool   `json:"is_admin"`
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
}

// Dog represents a dog's data
type Dog struct {
	Name         string `json:"name"`
	ID           int    `json:"id"`
	TattooNumber int    `json:"tattoo_number"`
	Total        int    `json:"total"`
	Awake        int    `json:"awake"`
	Rest         int    `json:"rest"`
	Active       int    `json:"active"`
	// outcome data
	BirthDate       string `json:"birth_date"`
	Breed           string `json:"breed"`
	Sex             string `json:"sex"`
	DogStatus       string `json:"dog_status"`
	HearingTraining string `json:"hearing_training"`
	RegionalCenter  string `json:"regional_center"`
	// convenience fields parsed from regional center
	RegionalCentersRaised  []string `json:"regional_centers_raised"`
	RegionalCentersTrained []string `json:"regional_centers_trained"`
}

// DayData represents one dog's data for a day
type DayData struct {
	ID     int `json:"id"`
	Total  int `json:"total"`
	Awake  int `json:"awake"`
	Rest   int `json:"rest"`
	Active int `json:"active"`
}

// Day represents the data for a day
type Day struct {
	Date string    `json:"date"`
	Dogs []DayData `json:"dogs"`
}

// DataBlob contains all data
type DataBlob struct {
	Dogs []*Dog `json:"dogs"`
	Days []*Day `json:"days"`
}

// PointsEntryDay are used to store date -> data blob
// entries in the database, so that we can cheaply pull any day's data
// we will place these in per-dog tables so there is no point in storing
// that here.
type PointsEntryDay struct {
	// YYYYMMDD
	Date string `json:"date"`
	// note that we don't index these to reduce costs
	// Data is {"timestamp": value}
	Data string `json:"entries" datastore:",noindex"`
}

// PointsEntryDayDeserialized is a PointsEntryDay with the Entries
// field desterialized
// This is what we serve from the api
type PointsEntryDayDeserialized struct {
	// YYYYMMDD
	Date string `json:"date"`
	// note that we don't index these to reduce costs
	// Data is {"timestamp": value}
	Data map[string]float64 `json:"entries"`
}
