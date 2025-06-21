Using the Application
You have both a CLI interface and a web API server. Here's how to use each:

Using the CLI
The CLI tool lets you run SQL queries directly from the command line:

If you're using TypeScript directly, you may need to use ts-node:

Using the Web API
First, you need to start the server. You should have a server.ts file (or create one if it doesn't exist):

Then start the server:

Once running, you can interact with the API using curl, Postman, or any HTTP client:

Get Database Schema
Run SQL Queries
Building for Production
For production use, compile TypeScript to JavaScript first:

Make sure you have proper tsconfig.json setup to compile your TypeScript files to the correct output directory.

--

WTF ? why did u suddenly stop mentioning file name for each code in the above answer so FREAKING rewrite else I could put the code in the wrong place