const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const _= require("lodash");

const app= express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const ToDoSchema =
{
  name: String
};

const Item = mongoose.model("Item", ToDoSchema);

const i1= new Item ({name: "Hi there"});
const i2= new Item ({name: "Press '+' to enter to add"});
const i3= new Item ({name: "<-- To cross of an item"});

const defaultItem= [i1, i2, i3];

const ListSchema=
{
  name: String,
  items: [ToDoSchema]
};

const List= mongoose.model("List", ListSchema);

app.get("/", function(req, res)
{
  Item.find({}, function(err,foundItems)
  {
    if( foundItems===0 )
    {
      Item.insertMany(defaultItem, function(err)
      {
        if(err)
          console.log(err);
        else
          console.log("Successfully added new item to the database.")
      });
      res.render("list", {listTitle: "Today", newItems: foundItems});
      res.redirect("/");
    }
    else
      res.render("list", {listTitle: "Today", newItems: foundItems});
  });
});

app.post("/", function(req, res)
{
  var itemName= req.body.addItem;
  var listName= req.body.list;
  const item= new Item
  ({
    name: itemName
  });

  if(listName=="Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name:listName}, function(err, foundList)
    {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res)
{
  const itemID= req.body.deleteItem;
  const listName= req.body.listName;
  
  if(listName==="Today")
  {
    Item.findByIdAndDelete(itemID, function(err)
    {
      if(!err)
      {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  }
  else
  {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, foundList)
    {
      if(!err)
        res.redirect("/"+listName);
    })
  }

});


app.get("/:customRoute", function(req, res)
{
  const routeName= _.capitalize(req.params.customRoute);
  List.findOne({name: routeName}, function(err, foundList)
  {
    if(!err)
    {
      if(!foundList)
      {
        //Create new list
        const list= new List
        ({
          name: routeName,
          items: defaultItem
        });
        list.save();
        res.redirect("/"+routeName);
      }
      else
      {
        res.render("list", {listTitle: foundList.name, newItems: foundList.items})
      }
    }
  });

});

// app.post("/work", function(req, res)
// {
//   workItems.push(item);
//   res.redirect("/work");
// });

app.listen(3000, function()
{
  console.log("Server started at port 3000");
});
