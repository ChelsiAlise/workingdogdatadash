package main

import (
	"fmt"

	"appengine"
	// https://cloud.google.com/appengine/docs/go/datastore/reference
	"appengine/datastore"
)

// AddDog adds a dog to the datastore
func AddDog(ctx appengine.Context, d *Dog) (id int64, err error) {
	key := datastore.NewKey(ctx, "Dog", "", int64(d.ID), nil)
	key, err = datastore.Put(ctx, key, d)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put Dog: %v", err)
	}
	return key.IntID(), nil
***REMOVED***

// AddDay adds a day to the datastore
func AddDay(ctx appengine.Context, d *Day) (id int64, err error) {
	key := datastore.NewKey(ctx, "Day", d.Date, 0, nil)
	key, err = datastore.Put(ctx, key, d)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put Day: %v", err)
	}
	return key.IntID(), nil
***REMOVED***

func GetAllDogs(ctx appengine.Context) ([]*Dog, error) {
	var dogs []*Dog
	q := datastore.NewQuery("Dog")
	_, err := q.GetAll(ctx, &dogs)
	if err != nil {
		return nil, fmt.Errorf("datastore: could not list dogs: %v", err)
	}
	return dogs, nil
***REMOVED***

func GetAllDays(ctx appengine.Context) ([]*Day, error) {
	var days []*Day
	q := datastore.NewQuery("Day")
	_, err := q.GetAll(ctx, &days)
	if err != nil {
		return nil, fmt.Errorf("datastore: could not list days: %v", err)
	}
	return days, nil
***REMOVED***
