//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://shlokdubey1k:"+process.env.DB_PASS+"@cluster0.phu1r.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList"
});

const item2 = new Item({
  name: "<-- Hit this button to delete a item"
});

const item3 = new Item({
  name: "Hit + to add an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err,foundItems) {

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) console.log(err);
        else console.log("Successfully added items to the list");
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.get("/:customListName",function(req,res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList) {
    if(!err) {
      if(!foundList) {
        // Creating a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else {
        // Displaying Existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item= new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }


});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if(listName === "Today") {
    Item.findByIdAndRemove({_id: checkedItemId}, function(err) {
      if(err) console.log(err);
      else console.log("Successfully deleted");
    });
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedItemId}}},function(err) {
      if(!err) {
        res.redirect("/"+listName);
      }
    });
  }


});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});
