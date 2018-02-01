const Bus = {
    addEventListener: document.addEventListener.bind( document ),
    removeEventListener: document.removeEventListener.bind( document ),
    dispatchEvent: document.dispatchEvent.bind( document ),
};

export default Bus;
