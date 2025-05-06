import Navbar from "../components/navbar/Navbar";
import styles from "./HomePage.module.css";

function HomePage() {
  return (
    <div className={styles.homePage}>
      <Navbar />
    </div>
  );
}

export default HomePage;
