// src/components/ProductList/ProductSkeleton.jsx
import React from "react";
import styles from "./ProductSkeleton.module.css";

const ProductSkeleton = () => {
  const skeletons = Array(6).fill(0);

  return (
    <div className={styles.container}>
      {skeletons.map((_, i) => (
        <div key={i} className={styles.productCard}>
          <div className={styles.imageContainer}>
            <div className={styles.productImage} />
          </div>
          <div className={styles.productInfo}>
            <div className={styles.productName} />
            <div className={styles.productPrice} />
            <div className={styles.productDetails} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
