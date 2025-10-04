import ThreadView from '../../../components/notes/ThreadView';

type Props = { params: { id: string } };

export default function NoteDetailPage({ params }: Props) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4 sm:mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Note Detail</h2>
        </header>
        <main className="flex-1">
          <ThreadView id={params.id} />
        </main>
      </div>
    </div>
  );
}
