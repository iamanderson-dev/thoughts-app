import React from 'react';
import Head from 'next/head';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Writing from './components/Writing';
import Thoughts from './components/Thoughts';



export default function Page() {
  return (
    <>
      <Head>
        <title>Thoughts — Pure Ideas, Shared Simply</title>
        <meta name="description" content="A space to share and follow pure thoughts. No media. No replies. Just ideas." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>


      

      <Navbar/>

      <main>
        <Hero />
        <Writing/>
        <Thoughts/>
      </main>
      <Footer/>
    </>
  );
}
