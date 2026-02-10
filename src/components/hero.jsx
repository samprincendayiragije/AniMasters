import { Copyright, Facebook, Tv, Twitch, Twitter, Watch, X, Youtube } from "lucide-react";
import { useState } from "react"
const supports = [
    {
        text : 'z',
        paragraph : 'architecto quisquam facilis quam minima dolorem tenetur, consequuntur animi? Ab, enim?',
        index : 1,
        recent : false
    },
     {
        text : 'galactic patrol',
        paragraph : 'architecto quisquam facilis quam minima dolorem tenetur, consequuntur animi? Ab, enim?',
        index : 2,
        recent : true
    },
     {
        text : 'super',
        paragraph : 'architecto quisquam facilis quam minima dolorem tenetur, consequuntur animi? Ab, enim?',
        index : 3,
        recent : false
    },
     {
        text : 'heroes',
        paragraph : 'architecto quisquam facilis quam minima dolorem tenetur, consequuntur animi? Ab, enim?',
        index : 4,
        recent : false
    }
]
export default function Hero() {
    const [activeTab, setactiveTab] = useState('');

    return (
        <section>
            <div className="h-screen bg-[url('/images/super.jpg')] bg-cover bg-center ">
                <div className="h-screen backdrop-blur-sm bg-black/60 flex items-center justify-center">
                    <div className="sm:w-280 w-85 h-50 sm:h-140 rounded-xl sm:rounded-2xl bg-[url('/images/super.jpg')] bg-cover bg-center">
                        <div className="sm:h-140 h-50 bg-black/40 rounded-xl sm:rounded-2xl border border-gray-400/50 shadow-2xl">
                            <div className="text-amber-200 sm:py-6 py-2 flex justify-between italic px-4 sm:px-12 rounded-t-2x">
                                <h1 className="sm:text-2xl text-[10px] font-medium"><span>
                                    <span>Ani</span>
                                    <span className="sm:text-xl text-[7px] text-gray-400">masters</span>
                                    </span></h1>
                                <div className="flex justify-between w-43 sm:w-110 items-center">
                                    <ul className="sm:space-x-8 space-x-2 sm:text-xl text-[8px]">
                                        <a href="#" onClick={()=>{setactiveTab('home')}} className={`${activeTab === "home" ? "text-white" : "text-gray-400"}`}>Home</a>
                                        <a href="#" onClick={()=>{setactiveTab('about')}} className={`${activeTab === "about" ? "text-white " : "text-gray-400"}`}>About</a>
                                        <a href="#" onClick={()=>{setactiveTab('contacts')}} className={`${activeTab === "contacts" ? " text-white" : "text-gray-400"}`}>Downloads</a>
                                    </ul>
                                    <button className="sm:w-25 w-10 h-3 sm:h-8 bg-black sm:text-lg text-[8px] flex items-center justify-center text-white border-gray-400 font-semibold rounded-full border sm:border-2">login</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2">
                                <div className="flex flex-col text-white pl-2 sm:px-12">
                                    <h1 className="sm:text-4xl text-xs text-amber-200 font-semibold italic pt-1 sm:pt-10">AniMasters</h1>
                                    <p className="sm:text-xl text-[9px] sm:py-5 pb-2 pt-1 text-gray-100 leading-tight">
                                        Watch and discover new streaming animes and read mangas, download free 
                                        and get the latest updates about the recent 
                                        releases all in one website and App.
                                    </p>
                                    <div className="flex sm:space-x-5 space-x-2">
                                        <button className="sm:w-30 w-15 text-[9px] sm:text-lg border text-black font-medium cursor-pointer bg-gradient-to-b from-amber-200 to-white/70  rounded-full">Watch</button>
                                        <button className="sm:w-30 w-15 text-[9px] sm:text-lg border backdrop-blur-3xl cursor-pointer  border-gray-400/60 rounded-full bg-black">Sign up</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center sm:mt-10">
                                <div className="bg-[url('images/black.jpg')] sm:w-100 w-30 h-20 sm:h-65 absolute bg-center rounded sm:rounded-xl bg-cover"/>
                                </div>
                            </div>
                            <div className="sm:grid sm:grid-cols-4 hidden sm:overflow-auto sm:space-x-5 space-x-2 mx-2 pt-4 sm:mx-5 sm:pt-15">
                               {supports.map((support, key)=>{
                                return(
                                    <div key={key} className={`${support.index%2 === 0 ? "flex border  border-amber-200/50 bg-black/30 backdrop-blur-xl rounded-2xl flex-col items-center justify-center italic text-white/60" : "flex border border-amber-200/50 backdrop-blur-xl bg-white/5 rounded-2xl flex-col items-center justify-center italic text-white/60"}`}>
                                            <h1 className="sm:text-xl text-sm text-amber-200 py-2">{support.text}</h1>
                                            <p className="sm:text-sm text-xs pl-3 py-5">{support.paragraph}</p>
                                    </div>
                                )
                               })}
                            </div>
                           <footer className="sm:hidden px-2 text-white text-xs lg:hidden flex space-x-3 h-11 my-5 rounded-b-2xl border-t border-white/20 bg-slate-950/60 ">
                               <div className="flex justify-between w-full">
                                <div>
                                <p className="mt-1 text-xs font-bold bg-gradient-to-b bg-clip-text colors text-transparent from-amber-200 via-amber-500 newfont to-amber-700 text-shadow-2xs text-shadow-amber-200/2">AniMasters</p> 
                                <center><Tv className="text-gray-400 fill-white/20"/></center>
                                </div>
                                <div className="flex py-1 flex-col justify-between">
                                    <span className="space-x-2 text-blue-600 text-[8px]">
                                        <a href=""><span>Animes</span></a>
                                        <a href=""><span>Mangas</span></a>
                                        <a href=""><span>Streaming</span></a>
                                        </span>
                                
                                </div>
                                <div className="flex px-1 space-x-1 flex-col justify-around">
                                <div className="grid grid-cols-3 space-x-1 mt-1">
                                    <a href=""><Facebook className="w-4 h-4 bg-blue-500 p-[2px] rounded-full"/></a>
                                    <a href=""><Youtube className="w-4 h-4 bg-red-600 p-[2px] rounded-full" /></a>
                                    <a href=""><Twitter className="w-4 h-4 bg-black p-[2px] rounded-full"/></a>
                                </div>
                                <span className="flex text-[6px] text-gray-400 justify-center"><Copyright className="text-gray-400 w-2 h-2"/>AniMasters 2026</span>
                                </div>
                                </div>
                           </footer>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}