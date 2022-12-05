const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");
const _ = require("lodash");


const app = express();
const items = [];
const workItems = [];  // we created an array so that we can add new items to existing ones

app.set('view engine', "ejs"); // tells our app to use ejs as its engine for templating in views
app.use(bodyParser.urlencoded({extended: true})); // To use bodyParser
app.use(express.static("public"));// to use our public files

// we create a new database
mongoose.connect("mongodb://localhost:127.0.0.1/todolistDB", {useNewUrlParser:true});

//we create a schema ie the structure of the document it expresses expected
//properties and values
const itemsSchema ={
  name: String};

// we create a model to read documents and item must start with capital letter
const Item = mongoose.model("item", itemsSchema);

// we create new documents using mongoose to be the default items inour todolist
const item1 = new Item({
  name:"Welcome to your todo list"
});

//we create an array of the items
const defaultItems =[item1];

// for every new list we create it will have a name and an array
// of item documents associated with it.
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);
// we insert the items into the items collection

app.get("/", function (req, res) {

// find finds our items collection in our app to send it in ejs
//its empty cos we want to find all items and trigger a callback found items
Item.find({}, function(err, foundItems){
  if(foundItems.length === 0) {
// insertMany inserts all our items in one go inside the items collection
// here defaultItems if our array collection is empty so that we dont insert
//over and over else we render our list.ejs
    Item.insertMany(defaultItems, function(err){
      if (err) {
        console.log(err);
      }else{
        console.log("succesfully saved default items to db");
      }
    });
    res.redirect("/"); // what this does is it checks our item collection
// there are none it creates the thre items and adds to ur items collection
// and redirects to our root route but this time it will not fall tothe if block
// but else block cos it has added the items and res.render them
      }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });
});

// to get whatever the user enters after the forward /
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
// to access our customlist either with capital or lower case letter

//find one checks if the customListName already exists so as not to create it over
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
    if(!foundList){

  // creates a new list for the user whatever he types in
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName); // redirects to whatever he types in
      //if it exists already else it renders it and creates it
    }else{
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
    }
  });



});
// when we loadup our page we loadup the home routeand render ourlist.js passing
// in two variables foundlist.name and items, newListItems == foundlist.items



// to post the request that was received
app.post("/", function (req, res) {
  const itemName = req.body.newItem; // we tap through the body of the request and look for newItem
  const listName = req.body.list;// same here cos the value in list.ejs
  const item = new Item({
    name: itemName
  });

// an if statement to redirect our default list and customListName
// to add items in tye coorect list
  if (listName==="Today"){
    item.save();
    res.redirect('/');
  }else{
//we find the custom list and push ie add the new item in the customlist
// redirecting it to the list name
    List.findOne({name:listName}, function(err,foundList){
      foundList.items.push(item); // we add the new item we got from our post request
      foundList.save();
      res.redirect("/"+ listName);
    });
  }

});

// we find and delete the checked item by its id
  app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName; //to check the list name

 //an if statement to delete the either fromhome route or custom lisr
    if (listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
    console.log("succesfully deleted checked item");
    res.redirect("/"); // finds remainning items and render after deleting
  }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundList){
    // we tap into our list model findone and update tne name of our custom list list name
    //update using the pull operator by specfying the name inside array items that have
    //id of checkedItemId and callback err and foundone corrrespondsto found list
    if (!err){
      res.redirect("/" + listName); // redirecting to customlist list name
    }
  });
}
  });

  app.get("/work", function(req, res){
    res.render("list", {listTitle: "work list", newListItems: workItems});
  });

  app.get("/about", function(req, res){
    res.render("about");
  });

  app.listen(process.env.PORT || 3000, function(){
      console.log("Server started on port: 3000!");
  });
