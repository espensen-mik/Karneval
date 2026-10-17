"use client";

import { useRef } from "react";
import UiIcon from "./ui-icon";

export default function SurveyPrize() {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="survey-prize" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      <span className="survey-prize-copy"><span>Deltag og</span><strong>Vind<br />billetter</strong></span>
      <span className="survey-prize-info">læs mere her</span>
    </button>
    <dialog ref={dialog} className="survey-prize-dialog" aria-labelledby="survey-prize-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="survey-prize-dialog-content">
        <button type="button" className="quote-modal-close" aria-label="Luk" onClick={() => dialog.current?.close()}><UiIcon name="close" /></button>
        <span className="eyebrow">TAK FOR DINE ORD</span>
        <h2 id="survey-prize-title">Deltag og vind billetter<span>.</span></h2>
        <p>Tak fordi du vil bidrage til Sjælen af Aalborg Karneval. Når du har indsendt dine svar, deltager du automatisk i lodtrækningen om 2 stk. billetter til Kildeparken til enten Børnekarneval eller selve Aalborg Karneval.</p>
        <p>Vi trækker lod den 1. december, og du får direkte besked på email, hvis du har vundet!</p>
      </div>
    </dialog>
  </>;
}
