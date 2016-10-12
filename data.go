package main

// Dog represents a dog's data
type Dog struct {
	Name         string `json:"name"`
	ID           int    `json:"id"`
	TattooNumber int    `json:"tattoo_number"`
	Total        int    `json:"total"`
	Awake        int    `json:"awake"`
	Rest         int    `json:"rest"`
	Active       int    `json:"active"`
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
