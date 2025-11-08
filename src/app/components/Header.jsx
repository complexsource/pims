"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white px-6 md:px-12 lg:px-20 py-4 shadow-sm flex items-center justify-between relative">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight text-gray-900"
      >
        <span className="inline-flex items-center gap-2 align-middle">
          <Image
            src={logo}
            width={32}
            height={32}
            alt="Brikvest Logo"
            className="inline-block"
          />
          <span className="leading-none">
            <span className="font-extrabold text-black">BRIK</span>VEST
          </span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-10 text-sm font-medium text-gray-700">
        <Link
          href="/properties"
          className="pb-1 border-b-2 border-transparent hover:border-black hover:text-black transition"
        >
          Properties
        </Link>
        <Link
          href="/list"
          className="pb-1 border-b-2 border-transparent hover:border-black hover:text-black transition"
        >
          List your property
        </Link>
        <Link
          href="/aboutus"
          className="pb-1 border-b-2 border-transparent hover:border-black hover:text-black transition"
        >
          About us
        </Link>
        <Link
          href="/contact"
          className="pb-1 border-b-2 border-transparent hover:border-black hover:text-black transition"
        >
          Contact
        </Link>
      </nav>

      {/* Desktop Auth Buttons */}
      <div className="hidden xl:flex gap-3">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 transition"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:opacity-90 transition"
        >
          Sign up
        </Link>
      </div>

      {/* Hamburger Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="xl:hidden text-gray-700"
        aria-label="Toggle menu"
      >
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-md lg:hidden z-50">
          <nav className="flex flex-col gap-4 p-6 text-gray-700 text-sm font-medium">
            <Link href="/properties" className="hover:text-black">
              Properties
            </Link>
            <Link href="/list" className="hover:text-black">
              List your property
            </Link>
            <Link href="/aboutus" className="hover:text-black">
              About us
            </Link>
            <Link href="/contact" className="hover:text-black">
              Contact
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/login"
                className="px-4 py-2 border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 transition text-center"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow hover:opacity-90 transition text-center"
              >
                Sign up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
