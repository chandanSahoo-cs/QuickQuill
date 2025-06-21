import Image from "next/image";
import Link from "next/link";
import { SearchInput } from "./SearchInput";

export const Navbar = () => {
  return (
    <nav className="flex items-center justify-between h-full w-full">
      <div className="flex gap-3 items-center shrink-0 pr-6">
        <Link href="/">
          <Image src="/favicon.svg" alt="Logo" width={40} height={40} />
        </Link>
        <h3 className="text-xl">QuickQuill</h3>
      </div>
      <SearchInput/>
      <div/>
    </nav>
  );
};
