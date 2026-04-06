import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js"; 

// 1. CONFIG: Load .env from the current directory (server folder)
dotenv.config(); 

// 2. CHECK: Ensure MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI is undefined. Make sure you are running this command from the 'server' folder.");
    process.exit(1);
}

const movies = [
  {
    _id: "1182387",
    title: "Pushpa 2: The Rule",
    tagline: "The Rule Begins",
    overview: "Pushpa Raj continues his quest for dominance in the red sandalwood smuggling syndicate, facing new enemies and challenges.",
    poster_path: "https://image.tmdb.org/t/p/original/1QdUd5jaJ3UaKz3tJmwK8qF8wK.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/b85bJFrTOSJ7i5wZ68nIu3E59t.jpg",
    release_date: "2024-12-05",
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }],
    runtime: 185,
    vote_average: 7.9,
    vote_count: 200
  },
  {
    _id: "1140062",
    title: "Stree 2",
    tagline: "Sarkate ka aatank",
    overview: "The town of Chanderi is being haunted again. This time, the women are mysteriously abducted by a headless entity known as Sarkata.",
    poster_path: "https://image.tmdb.org/t/p/original/d7T7e3l3uK4e5u9c8z1.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/mK7lD1p5.jpg", 
    release_date: "2024-08-15",
    genres: [{ id: 35, name: "Comedy" }, { id: 27, name: "Horror" }],
    runtime: 149,
    vote_average: 7.2,
    vote_count: 600
  },
  {
    _id: "1041613",
    title: "Kalki 2898 AD",
    tagline: "The Avatar Arrives",
    overview: "A modern avatar of Vishnu, a Hindu god, is believed to have descended to earth to protect the world from evil forces.",
    poster_path: "https://image.tmdb.org/t/p/original/9f9.jpg", 
    backdrop_path: "https://image.tmdb.org/t/p/original/of8.jpg",
    release_date: "2024-06-27",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 28, name: "Action" }],
    runtime: 181,
    vote_average: 8.1,
    vote_count: 1200
  },
  {
    _id: "533535",
    title: "Deadpool & Wolverine",
    tagline: "Come together.",
    overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him.",
    poster_path: "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
    release_date: "2024-07-24",
    genres: [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }],
    runtime: 128,
    vote_average: 7.7,
    vote_count: 3500
  },
  {
    _id: "762509",
    title: "Mufasa: The Lion King",
    tagline: "Orphan. Outsider. King.",
    overview: "Simba, having become king of the Pride Lands, is determined for his cub to follow in his paw prints while the origins of his late father Mufasa are explored.",
    poster_path: "https://image.tmdb.org/t/p/original/iBqXjF.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/oPu.jpg",
    release_date: "2024-12-20",
    genres: [{ id: 12, name: "Adventure" }, { id: 10751, name: "Family" }],
    runtime: 118,
    vote_average: 7.4,
    vote_count: 300
  },
  {
    _id: "1234568",
    title: "Singham Again",
    tagline: "Roar Again",
    overview: "Bajirao Singham returns to fight a new enemy, joining forces with other cops in the cop universe to save his wife.",
    poster_path: "https://image.tmdb.org/t/p/original/1.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/2.jpg",
    release_date: "2024-11-01",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }],
    runtime: 160,
    vote_average: 6.5,
    vote_count: 300
  },
  {
    _id: "1234567",
    title: "Bhool Bhulaiyaa 3",
    tagline: "The Spirits Return",
    overview: "Rooh Baba returns to face a new spirit in the ancient haveli, unraveling dark secrets and comedic chaos.",
    poster_path: "https://image.tmdb.org/t/p/original/bb3.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/bb3_bg.jpg",
    release_date: "2024-11-01",
    genres: [{ id: 35, name: "Comedy" }, { id: 27, name: "Horror" }],
    runtime: 155,
    vote_average: 7.0,
    vote_count: 450
  },
  {
    _id: "558449",
    title: "Gladiator II",
    tagline: "What we do in life echoes in eternity.",
    overview: "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius is forced to enter the Colosseum.",
    poster_path: "https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvot.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXfufEmbDS668h.jpg",
    release_date: "2024-11-13",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    runtime: 148,
    vote_average: 7.5,
    vote_count: 500
  },
  {
    _id: "912649",
    title: "Venom: The Last Dance",
    tagline: "'Til death do they part.",
    overview: "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced to into a devastating decision.",
    poster_path: "https://image.tmdb.org/t/p/original/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg",
    release_date: "2024-10-22",
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
    runtime: 109,
    vote_average: 6.8,
    vote_count: 900
  },
  {
    _id: "933260",
    title: "The Substance",
    tagline: "If you could be better, would you?",
    overview: "A fading celebrity decides to use a black market drug, a cell-replicating substance that temporarily creates a younger, better version of herself.",
    poster_path: "https://image.tmdb.org/t/p/original/lqoMzCcZYEFK729d6qzt349fB4o.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/7h6TERHadyCkwqD95ZlF2tWL5sV.jpg",
    release_date: "2024-09-07",
    genres: [{ id: 18, name: "Drama" }, { id: 27, name: "Horror" }],
    runtime: 141,
    vote_average: 7.2,
    vote_count: 300
  }
];

const seedDB = async () => {
  try {
    // 3. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database connected for seeding");

    // 4. Insert Movies (Upsert prevents duplicates if _id exists)
    for (const movie of movies) {
        await Movie.findByIdAndUpdate(movie._id, movie, { upsert: true, new: true });
    }
    
    console.log(`🎉 Successfully seeded ${movies.length} movies!`);
    
    // 5. Disconnect
    mongoose.connection.close();
    process.exit();

  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();