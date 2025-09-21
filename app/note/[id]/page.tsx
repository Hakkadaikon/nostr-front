import ThreadView from '../../../components/notes/ThreadView';

type Props = { params: { id: string } };

export default function NoteDetailPage({ params }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Note Detail</h2>
      <ThreadView id={params.id} />
    </div>
  );
}
