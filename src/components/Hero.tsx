import { Link } from 'react-router';

const Hero = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black px-4 overflow-hidden">
      {/* Gradient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#80caff6d] to-[#4e46e571] opacity-20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Main heading */}
        <h1 className="mx-auto max-w-4xl text-center text-5xl font-bold tracking-tight text-white sm:text-7xl">
          The Excel Data 
          <span className="relative whitespace-nowrap">
            <span className="relative"> Importer</span>
          </span>
        </h1>

        {/* Description text */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-400">
          Used by some of the world's largest companies to import data from Excel files into their applications. 
          <span className="text-white"> Build like the best.</span>
        </p>

        {/* Call to action buttons */}
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to="/upload" className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200">
            Get Started
          </Link>
          <Link to={"/documents"} className="rounded-lg border border-gray-700 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-900">
            View Uploads
          </Link>
        </div>
      </div>

      {/* Optional: Add a subtle fade at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
};

export default Hero;