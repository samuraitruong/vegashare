# Vega CLI

Vega CLI is a command-line tool for managing and interacting with the VegaShare system. It is designed to simplify tasks such as listing files in a directory and can be extended to include more functionality in the future.

## Features

- Accepts an input path via the `--inputPath` parameter.
- Lists all files in the specified directory.

## Installation

1. Navigate to the `vega-cli` directory:

   ```bash
   cd server/vega-cli
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Optionally, link the CLI globally for easier usage:
   ```bash
   npm link
   ```

## Usage

### Run the CLI

You can run the CLI tool using the following command:

```bash
node index.js --inputPath /path/to/folder
```

### Global Usage (if linked)

If you linked the CLI globally, you can use it as:

```bash
vega-cli --inputPath /path/to/folder
```

### Example

To list all files in the `/Users/truongnguyen/Documents` directory:

```bash
vega-cli --inputPath /Users/truongnguyen/Documents
```

## Development

### Project Structure

- `index.js`: The main entry point for the CLI tool.
- `package.json`: Configuration file for the Node.js project.

### Adding New Features

To add new features, modify the `index.js` file and extend the functionality as needed.

## License

This project is licensed under the ISC License. See the LICENSE file for details.
