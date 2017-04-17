/*
	this file contains all code for interacting with cloud datastore
*/

package main

import (
	"fmt"

	"appengine"
	// https://cloud.google.com/appengine/docs/go/datastore/reference
	"appengine/datastore"
)

// 1440 minutes is a full day, we want 70% of day at least
const FilterThreshold int = 1008

// addUser puts a user in the datastore
func addUser(ctx appengine.Context, u *User) (id int64, err error) {
	key := datastore.NewKey(ctx, "Users", u.Username, 0, nil)
	key, err = datastore.Put(ctx, key, u)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put User: %v", err)
	}
	return key.IntID(), nil
}

// getUser returns a user from the datastore if they exist
func getUser(ctx appengine.Context, username string) (u *User, err error) {
	u = new(User)
	key := datastore.NewKey(ctx, "Users", username, 0, nil)
	if err = datastore.Get(ctx, key, u); err != nil {
		return nil, fmt.Errorf("datastoredb: could not get User with username: %s Err: %v", username, err)
	}
	return u, err
}

// deleteUsers delets a user from the datastore if they exist
func deleteUser(ctx appengine.Context, username string) error {
	key := datastore.NewKey(ctx, "Users", username, 0, nil)
	return datastore.Delete(ctx, key)
}

// getUsers returns all of the users in the datastore
func getUsers(ctx appengine.Context) ([]*User, error) {
	var users []*User
	q := datastore.NewQuery("Users")
	_, err := q.GetAll(ctx, &users)
	if err != nil {
		ctx.Errorf("datastore: could not list users: %v", err)
		return nil, fmt.Errorf("datastore: could not list users: %v", err)
	}
	return users, nil
}

// addDataDog adds a dog to the datastore
func addDataDog(ctx appengine.Context, d *Dog) (id int64, err error) {
	key := datastore.NewKey(ctx, "Dog", "", int64(d.ID), nil)
	key, err = datastore.Put(ctx, key, d)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put Dog: %v", err)
	}
	return key.IntID(), nil
}

// addDataDay adds a day to the datastore
func addDataDay(ctx appengine.Context, d *Day) (id int64, err error) {
	key := datastore.NewKey(ctx, "Day", d.Date, 0, nil)
	key, err = datastore.Put(ctx, key, d)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put Day: %v", err)
	}
	return key.IntID(), nil
}

// getDataDogs returns all of the dogs in the datastore
func getDataDogs(ctx appengine.Context) ([]*Dog, error) {
	var dogs []*Dog
	q := datastore.NewQuery("Dog")
	_, err := q.GetAll(ctx, &dogs)
	if err != nil {
		return nil, fmt.Errorf("datastore: could not list dogs: %v", err)
	}
	return dogs, nil
}

// getDataDays returns all of the days in the datastore
func getDataDays(ctx appengine.Context) ([]*Day, error) {
	var days []*Day
	q := datastore.NewQuery("Day")
	_, err := q.GetAll(ctx, &days)
	if err != nil {
		ctx.Errorf("datastore: could not list days: %v", err)
		return nil, fmt.Errorf("datastore: could not list days: %v", err)
	}
	return days, nil
}

// getDataBlob creates a DataBlob from the datastore
func getDataBlob(ctx appengine.Context) (data DataBlob, err error) {
	dogs, err := getDataDogs(ctx)
	if err != nil {
		return data, fmt.Errorf("datastore: Failed to get dogs")
	}
	days, err := getDataDays(ctx)
	if err != nil {
		return data, fmt.Errorf("datastore: Failed to get days")
	}
	data.Dogs = dogs
	data.Days = days
	return data, nil
}

// getDataFilteredDays returns getDataDays filtered by FilterThreshold
func getDataFilteredDays(ctx appengine.Context) ([]*Day, error) {
	days, err := getDataDays(ctx)
	if err != nil {
		ctx.Errorf("Failed to GetDataDays %v", err)
		return nil, err
	}
	filteredDays := days[:0]
	for _, day := range days {
		filteredDogs := day.Dogs[:0]
		for _, dog := range day.Dogs {
			if dog.Total >= FilterThreshold {
				filteredDogs = append(filteredDogs, dog)
			}
		}
		if len(filteredDogs) > 0 {
			day.Dogs = filteredDogs
			filteredDays = append(filteredDays, day)
		}
	}
	return filteredDays, nil
}

// getDataFilteredDogs returns getDataDogs filtered by FilterThreshold
func getDataFilteredDogs(ctx appengine.Context) ([]*Dog, error) {
	days, err := getDataFilteredDays(ctx)
	if err != nil {
		ctx.Errorf("Failed to GetDataFilteredDays %v", err)
		return nil, err
	}
	dogs, err := getDataDogs(ctx)
	if err != nil {
		ctx.Errorf("Failed to GetDataDogs %v", err)
		return nil, err
	}
	// replace totals with filtered totals
	dogMap := make(map[int]*Dog)
	for _, dog := range dogs {
		dogMap[dog.ID] = dog
		dog.Total = 0
		dog.Awake = 0
		dog.Rest = 0
		dog.Active = 0
	}
	for _, day := range days {
		for _, dog := range day.Dogs {
			dogData := dogMap[dog.ID]
			dogData.Total += dog.Total
			dogData.Awake += dog.Awake
			dogData.Rest += dog.Rest
			dogData.Active += dog.Active
		}
	}
	return dogs, nil
}

// getDataFilteredBlob returns getDataBlob filtered by FilterThreshold
func getDataFilteredBlob(ctx appengine.Context) (data DataBlob, err error) {
	days, err := getDataFilteredDays(ctx)
	if err != nil {
		return data, err
	}
	dogs, err := getDataDogs(ctx)
	if err != nil {
		return data, err
	}
	// replace totals with filtered totals
	dogMap := make(map[int]*Dog)
	for _, dog := range dogs {
		dogMap[dog.ID] = dog
		dog.Total = 0
		dog.Awake = 0
		dog.Rest = 0
		dog.Active = 0
	}
	for _, day := range days {
		for _, dog := range day.Dogs {
			dogData := dogMap[dog.ID]
			dogData.Total += dog.Total
			dogData.Awake += dog.Awake
			dogData.Rest += dog.Rest
			dogData.Active += dog.Active
		}
	}
	data.Dogs = dogs
	data.Days = days
	return data, nil
}

// pointsEntryKind returns a "kind" to use for storing a dog's data in
// cloud datastore
func pointsEntryKind(dogID string) string {
	return "points/dog_id=" + dogID
}

// addPointsEntryDay adds a PointsEntryDay to the database
func addPointsEntryDay(ctx appengine.Context, p *PointsEntryDay, dogID string) (id int64, err error) {
	key := datastore.NewKey(ctx, pointsEntryKind(dogID), p.Date, 0, nil)
	key, err = datastore.Put(ctx, key, p)
	if err != nil {
		return 0, fmt.Errorf("datastoredb: could not put PointsEntryDay: %v", err)
	}
	return key.IntID(), nil
}

// getsPointsDays returns a slice of date strings for entries matching dog id
func getPointsDays(ctx appengine.Context, dogID string) (dates []string, err error) {
	query := datastore.NewQuery(pointsEntryKind(dogID)).KeysOnly()
	keys, err := query.GetAll(ctx, nil)
	if err != nil {
		return nil, err
	}
	dates = make([]string, len(keys))
	for i := 0; i < len(keys); i++ {
		dates[i] = keys[i].StringID()
	}
	return dates, nil
}

// getPointsEntryDay gets the points entry associated with a date string and
// dog id from the datestore
func getPointsEntryDay(ctx appengine.Context, dogID string, date string) (p *PointsEntryDay, err error) {
	p = new(PointsEntryDay)
	key := datastore.NewKey(ctx, pointsEntryKind(dogID), date, 0, nil)
	if err = datastore.Get(ctx, key, p); err != nil {
		return nil, fmt.Errorf("datastoredb: could not get PointsEntryDay with dogID: %s date: %s Err: %v", dogID, date, err)
	}
	return p, nil
}
