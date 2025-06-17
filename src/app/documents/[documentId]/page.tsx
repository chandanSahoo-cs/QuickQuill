import { Editor } from "./Editor";

interface DocumentIdPageProps {
    params : Promise<{documentId: string}>;
}


const DocumentIdPage = async ({params}: DocumentIdPageProps) => {
    const {documentId} = await params;
    return (
        <div className="min-h-screen bg-[#FAFBFD]">
            <Editor/>
        </div>
    );
}
 
export default DocumentIdPage;