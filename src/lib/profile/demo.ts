import type { NowPlaying, PublicProfile } from "./types";

/**
 * Demo profile shown at /zaid. Matches docs/design/profile-cinema.html.
 *
 * Used when Supabase is not configured yet. The same data is in
 * supabase/seed.sql, so /zaid looks the same once the database is connected.
 * Keep the two in sync.
 */

export const DEMO_USERNAME = "zaid";

/**
 * Static Now Playing card for the demo only, so the page matches the mockup.
 * Live Now Playing (Last.fm) arrives in Milestone 6 and replaces this.
 */
export const DEMO_NOW_PLAYING: NowPlaying = {
  track: "505",
  artist: "Arctic Monkeys",
  album: "Favourite Worst Nightmare",
  imageUrl: null,
  elapsedSeconds: 154,
  durationSeconds: 253,
};

export const DEMO_PROFILE: PublicProfile = {
  username: DEMO_USERNAME,
  displayName: "Zaid",
  bio: "CS / cars / movies / music. Films that keep me up at night.",
  location: "Amman",
  avatarUrl: null,
  coverUrl: null,
  accent: "amber",
  nowPlaying: DEMO_NOW_PLAYING,
  sections: [
    {
      id: "demo-films",
      kind: "films",
      entries: [
        {
          id: "demo-film-1",
          rank: 1,
          status: "favorite",
          rating: 5,
          whyILoveIt: "The movie that made me obsessed with space.",
          progress: null,
          item: {
            kind: "film",
            title: "Interstellar",
            subtitle: "Christopher Nolan",
            year: 2014,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Sci-Fi"],
            tint: "#1E2733",
          },
        },
        {
          id: "demo-film-2",
          rank: 2,
          status: "favorite",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "film",
            title: "The Dark Knight",
            subtitle: "Christopher Nolan",
            year: 2008,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Action"],
            tint: "#26262B",
          },
        },
        {
          id: "demo-film-3",
          rank: 3,
          status: "favorite",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "film",
            title: "Whiplash",
            subtitle: "Damien Chazelle",
            year: 2014,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Drama"],
            tint: "#4A2E1F",
          },
        },
        {
          id: "demo-film-4",
          rank: 4,
          status: "favorite",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "film",
            title: "Se7en",
            subtitle: "David Fincher",
            year: 1995,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Thriller"],
            tint: "#2F2B1F",
          },
        },
        {
          id: "demo-film-5",
          rank: 5,
          status: "favorite",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "film",
            title: "Fight Club",
            subtitle: "David Fincher",
            year: 1999,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Drama"],
            tint: "#3B1E24",
          },
        },
      ],
    },
    {
      id: "demo-shows",
      kind: "shows",
      entries: [
        {
          id: "demo-show-1",
          rank: 1,
          status: "watching",
          rating: null,
          whyILoveIt: null,
          progress: "Season 3 · Episode 4",
          item: {
            kind: "show",
            title: "Breaking Bad",
            subtitle: "Vince Gilligan",
            year: 2008,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Drama"],
            tint: "#3D4A22",
          },
        },
        {
          id: "demo-show-2",
          rank: 2,
          status: "completed",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "show",
            title: "Dark",
            subtitle: "Baran bo Odar",
            year: 2017,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Sci-Fi"],
            tint: "#22303A",
          },
        },
        {
          id: "demo-show-3",
          rank: 3,
          status: "completed",
          rating: null,
          whyILoveIt: null,
          progress: null,
          item: {
            kind: "show",
            title: "Better Call Saul",
            subtitle: "Vince Gilligan",
            year: 2015,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Drama"],
            tint: "#4A3A1F",
          },
        },
      ],
    },
    {
      id: "demo-books",
      kind: "books",
      entries: [
        {
          id: "demo-book-1",
          rank: 1,
          status: "reading",
          rating: null,
          whyILoveIt: null,
          progress: "page 212",
          item: {
            kind: "book",
            title: "1984",
            subtitle: "George Orwell",
            year: 1949,
            imageUrl: null,
            backdropUrl: null,
            genres: ["Fiction"],
            tint: "#6E2B22",
          },
        },
      ],
    },
  ],
  links: [
    { platform: "instagram", url: "https://www.instagram.com/" },
    { platform: "letterboxd", url: "https://letterboxd.com/" },
    { platform: "lastfm", url: "https://www.last.fm/" },
  ],
};
