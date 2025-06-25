import PuzzleCanvas from '@/components/PuzzleCanvas'

export default function Home() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
        {/* <div className="font-black text-9xl text-black">puzzzzzzzzzle</div> */}
      <PuzzleCanvas imageSrc="/sample.jpg" />
    </main>

  );
}
