"use client"

import Image from "next/image"
import Link from "next/link"
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs"
import { SearchInput } from "./SearchInput"
import { motion } from "framer-motion"

export const Navbar = () => {
  return (
    <nav className="flex items-center justify-between h-full w-full">
      <motion.div whileHover={{ scale: 1.01 }} className="flex gap-3 items-center shrink-0 pr-6">
        <Link href="/" className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 3 }} transition={{ type: "spring", stiffness: 300 }}>
            <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          </motion.div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
            QuickQuill
          </h1>
        </Link>
      </motion.div>

      <SearchInput />

      <div className="flex gap-4 items-center pl-6">
        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/"
            afterLeaveOrganizationUrl="/"
            afterSelectOrganizationUrl="/"
            afterSelectPersonalUrl="/"
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <UserButton />
        </motion.div>
      </div>
    </nav>
  )
}
