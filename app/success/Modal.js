import React from "react";

export default function Modal({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null; //モーダルが開いていない場合は何も表示しない

  return (
    <div classname="modal-overlay">
      <div className="modal-content">
        <h2>動画の編集を申し出る</h2>
        <p>この動画の編集を申し出ますか？</p>
        <div className="modal-buttons">
          <button onClick={onSubmit} className="modal-submit">
            はい
          </button>
          <button onClick={onClose} classname="modal-cancel">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
