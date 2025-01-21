const path = require("path");


const joinedPath = path.join(__dirname, "text", "bio.text"); // this only uses the actual path i.e. provided here
console.info(joinedPath); // Output: "folder/subfolder/file.txt"


const absolutePath = path.resolve("folder", "subfolder", "file.txt"); // this uses full path (i.e. given) and the actual full path
console.log("Absolute Path:", absolutePath); // Output: "Home/pallab/backend/quick_node/file.txt"

// Get the directory name
console.log("Directory Name:", path.dirname(joinedPath));

// Get the base file name (with extension)
console.log("Base Name:", path.basename(joinedPath));


// Get the file extension
console.log("File Extension:", path.extname(joinedPath));

// Parse a file path into an object
const parsedPath = path.parse(joinedPath);
console.log("Parsed Path:", parsedPath);

// Format a path from an object
const formattedPath = path.format(parsedPath);
console.log("Formatted Path:", formattedPath);


// Check if a path is absolute
console.log("Is Absolute (joinedPath):", path.isAbsolute(joinedPath));
console.log("Is Absolute ('/home/user'):", path.isAbsolute("/home/user"));

// Relative path between two locations (both available within `data/user`)
const relativePath = path.relative("/data/user/docs", "/data/user/photos");
console.log("Relative Path:", relativePath);


// Path separator
console.log("Path Separator:", path.sep);

// Path delimiter (used in environment variables like PATH)
console.log("Path Delimiter:", path.delimiter);

// Handling platform-specific cases
console.log("Platform-Specific Path Separator:", path.sep);
console.log("Platform-Specific Delimiter:", path.delimiter);

// Example: Splitting a PATH environment variable (cross-platform)
const paths = process.env.PATH.split(path.delimiter);
console.log("PATH Directories:", paths);

// Example use case: Resolve the config file dynamically
const configPath = path.resolve(__dirname, "config", "settings.json");
console.log("Config Path:", configPath);

// Example: Load environment-specific configuration
const env = process.env.NODE_ENV || "development";
const envConfigPath = path.resolve(__dirname, "config", `${env}.json`);
console.log(`Environment Config Path (${env}):`, envConfigPath);



