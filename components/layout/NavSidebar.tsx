export default function NavSidebar() {
  return (
    <aside className="hidden md:block w-60 pr-6">
      <nav aria-label="Primary" className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <a className="block hover:underline focus:underline" href="/">Home</a>
        <a className="block hover:underline focus:underline" href="/settings">Settings</a>
      </nav>
    </aside>
  );
}
