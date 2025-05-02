# Subreddit Graph Explorer

A Next.js application that fetches and displays post data from Reddit.

## Features

- Fetch posts from any subreddit via API
- Basic post display functionality

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/subreddit-graph-explorer.git
cd subreddit-graph-explorer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

## Usage

Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /api/subreddit/posts?name={subreddit}&limit={count}`
  - Fetches posts from specified subreddit
  - Parameters:
    - `name`: Subreddit name (required)
    - `limit`: Number of posts to fetch (default: 15)

## Technologies Used

- Next.js
- React

## License

[MIT](https://choosealicense.com/licenses/mit/)
