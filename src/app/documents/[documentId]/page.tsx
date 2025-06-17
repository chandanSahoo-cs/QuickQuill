import { Editor } from "./Editor";
import { Toolbar } from "./Toolbar";
interface DocumentIdPageProps {
    params : Promise<{documentId: string}>;
}


const DocumentIdPage = async ({params}: DocumentIdPageProps) => {
    const {documentId} = await params;
    return (
        <div className="min-h-screen bg-[#FAFBFD]">
            <Toolbar/>
            <Editor/>
        </div>
    );
}
 
export default DocumentIdPage;