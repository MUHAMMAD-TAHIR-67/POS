import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";

const QRCodeGenerator = () => {
  const [items, setItems] = useState([]);

  const addItem = () => {
    let na = prompt()
    const uniqueId = uuidv4();
    const newItem = {
      id: uniqueId,
      name: na,

    };
    setItems((prevItems) => [...prevItems, newItem]);
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <div>
        {items.map((item) => (
          <div key={item.id} style={{ margin: "20px", textAlign: "center" }}>
            <p><strong>Name:</strong> {item.name}</p>
            <img
            
              alt={`Item ${item.name}`}
              style={{ width: "100px", height: "100px", margin: "10px" }}
            />
            {/* Encode Name, ID, and Image URL in QR Code */}
            <QRCodeSVG
              value={JSON.stringify({
                id: item.id,
                name: item.name,
            
              })}
              size={128}
            />
            <p><strong>ID:</strong> {item.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
