import { Navbar } from "./Navbar";
import { TemplateGallery } from "./TemplateGallery";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4">
        <Navbar />
      </div>
      <div className="mt-16">
        <TemplateGallery />
      </div>
    </div>
  );
};

export default Home;
