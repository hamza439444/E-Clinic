// const express = require("express");
// const router = express.Router();

// const Blog = require("../models/blogs");
// // const { default: Blogs } = require("../../Frontend/src/components/Blogs");

// // Array of blog objects
// const blogs = [
//   {
//     image: 'https://example.com/image1.jpg',
//     title: 'Example Blog Title 1',
//     description: 'This is an example blog description 1.'
//   },
//   {
//     image: 'https://example.com/image2.jpg',
//     title: 'Example Blog Title 2',
//     description: 'This is an example blog description 2.'
//   }
// ];

// // Save the blogs to the database
// Blog.insertMany(blogs)
//   .then(savedBlogs => {
//     console.log('Blogs saved:', savedBlogs);
//   })
//   .catch(error => {
//     console.error('Error saving blogs:', error);
//   });

//   router.get("/", (req, res) => {
//     Blog.find()
//       .then(blogs => {
//         res.json(blogs);
//       })
//       .catch(error => {
//         console.error('Error fetching blogs:', error);
//         res.status(500).json({ error: 'Internal server error' });
//       });
//   });
//               // .............................///////////////////////////...................//

  
// module.exports = router;
