Backend project with javascript

- [Model link] (https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)


NOTES

environment variables file- store app secrets

gitignore- that need not be passed on git

package.json- dependencies and description of project made in the beginning

"scripts": {
    "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"}

nodemon for running as we save changes
-r dotenv/config to config .env before running and it is required -r, -D for development dependency
--experimental-json-modules to enable 'import'

axios to fetch data .then .catch

arrays.map((array)=>{return(array.name)})

prettier for consistency in coding patterns (.prettierignore)


src
-controllers methods and functionality
-db connect db and backend
-middleware middle man before we do something, apply middleware like multer, for uploading files, use app.use()
-models
-routes
-utils repetitive code or functions that we need to use like email input
    -API error handling error from api side
    -APIResponse success from api side
    -asyncHandler resolves promise
    -cludinary generic code for uploading media files from local server(behaves as checkpoint when fails to upload on cloudinary we can retry)
-app.js
-constants.js immutable constants like db name
-index.js