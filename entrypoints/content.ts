import axios from 'axios';
export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  main() {
    console.log('LinkedIn AI Reply: Content script loaded.');

    let aiIcon: HTMLImageElement | null = null;
    let modal: HTMLElement | null = null;

    // Function to inject the AI icon when the message box is focused
    function injectAIIcon() {
      const messageBox = document.querySelector('div.msg-form__contenteditable') as HTMLElement;
      if (!messageBox || aiIcon) return;

      // Create AI icon element
      aiIcon = document.createElement('img');
      // aiIcon.src = chrome.runtime.getURL('aibtn.svg'); // Path to your AI icon
      // due to cps issue
      aiIcon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAYAAAAmL5yKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAF8SURBVHgBjVJBTsJAFP3TaYkLTOqCGHcltInLegLKCcAbTCh75QZwAnGPKZ4APEHxBLqXhO4IlAQWmpi00/FPtYaSKryk7e+8ef+/P/MJ/MBgG12jsf/2ULmCPRhsjlx5jKEe8fg6GF0EGaf8boCohaFtsoVjsIWRE6tlH0DogsCTRjV/l08TpNkp8WRMqOpTSm9zYiEg4h+N2bDSA0ieS1QZZAlU+ULbjUvMyqk6x5jkxWBHnFeDUXVrsZWNNZsJ4fc5BxKfcLIVQCbZf4meelL87VAdy9aAKr5A8Wx43sv2ESiA1V57QATbXxck6e+Kcw6OFctWa+6yVZjgmMpcoQ4B5Qb2WzgkzuYEJYa8UiQCvJE+ObayhNkJHUjAwbJNfLpx/P6qWu3w7pDYaq9YlGiT2fBsWnPXOgFRx5mYpi1YbrjBr/6XuMbWLYUKL0nEIxd8sDvGkB6iEN3/bBMq0gMjCqlTqthQBGnRdMMXs7PsFfHIjc0ODlIBvgBaiMGA25CTRAAAAABJRU5ErkJggg=='
      aiIcon.style.position = 'absolute';
      aiIcon.style.cursor = 'pointer';
      aiIcon.style.right = '10px';
      aiIcon.style.bottom = '10px';
      aiIcon.style.width = '24px';
      aiIcon.style.backgroundColor = 'white';
      aiIcon.style.borderRadius = '50%';
      aiIcon.style.padding = '3px';
      aiIcon.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.3)';

      // Inject AI icon
      messageBox.style.position = 'relative'; // To position icon inside the box
      messageBox.appendChild(aiIcon);

      // Handle AI icon click - Show modal
      aiIcon.addEventListener('click', () => {
        showAIModal();
      });
    }

    // Function to remove the AI icon when message box loses focus
    function removeAIIcon() {
      if (aiIcon) {
        aiIcon.remove(); 
        aiIcon = null;
      }
    }

    // Function to show a modal for AI reply
    function showAIModal() {
      modal = document.createElement('div');
      modal.innerHTML = `
        <div id="modal-container" style="
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          color: black;
        ">
          <div id="modal-content" style="
            background-color: #1a202c; 
            padding: 15px; 
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            border-radius: 8px;
            position: relative;
            width: 40vw;
          ">
            <style>
                #ai-input::placeholder {
                    color: #cbd5e0; 
                }
                #ai-input {
      outline: none;
}
            </style>
            <div id="chat-container" style="display: none; flex-direction: column; max-height: 300px; overflow-y: auto;">
              <div id="user-prompt" style="margin-bottom: 10px;">
    <p id="prompt-text" style="color: black; max-width: 80%; width: fit-content; background-color: #DFE1E7; padding: 4px 8px; border-radius: 4px; display: inline-block; float: right; font-weight: 500;"></p>
</div>
<div id="ai-response" style="margin-bottom: 10px;">
    <p id="response-text" style="color: black; max-width: 80%; width: fit-content; background-color: #DBEAFE; padding: 4px 8px; border-radius: 4px; display: inline-block; float: left; font-weight: 500;"></p>
</div>

            </div>
            <input id="ai-input" type="text" placeholder="Your Prompt" style="
              width: 100%;
              padding: 10px;
              background-color: #2d3748;
              border-radius: 6px;
              margin-bottom: 10px;
              outline: none;
              color: #cbd5e0;
              font-size: 16px;
            "/>
            <button id="generate-btn" style="
              background-color: #3B82F6;
              color: white;
              border: none;
              padding: 7px 11px;
              border-radius: 6px;
              cursor: pointer;
              float: right;
              font-size: 16px; 
              font-weight: 500;
            ">Generate</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Handle click outside to close modal
      modal.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).id === 'modal-container') {
          closeAIModal();
        }
      });

      // Handle Generate Button Click
      document.getElementById('generate-btn')?.addEventListener('click', async () => {
        const userInput = (document.getElementById('ai-input') as HTMLInputElement).value;
      
        // Make sure user input is not empty
        if (!userInput) {
          alert("Please enter a prompt.");
          return;
        }

        const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
        generateBtn.innerText = 'Generating...';
        generateBtn.disabled = true;
      
        try {
          const options = {
            method: 'POST',
            url: 'https://open-ai21.p.rapidapi.com/chatgpt',
            headers: {
              'x-rapidapi-key': process.env.RAPID_API_KEY,
              'x-rapidapi-host': 'open-ai21.p.rapidapi.com',
              'Content-Type': 'application/json'
            },
            data: {
              messages: [
                {
                  role: 'user',
                  content: `User Input: "Set up a meeting to discuss project updates."

AI Output: "Please schedule a meeting to review the latest project updates and discuss any necessary adjustments or next steps. This will ensure that all team members are aligned and any issues are addressed promptly." take this as a example and generate result for this message: "${userInput}". Avoid unnecessary formatting or over-elaboration. The result should read smoothly and naturally.`,
                }
              ],
              web_access: false
            }
          };
      
          const response = await axios.request(options);
          let aiResponse = response.data.result; // Adjust according to API response structure
          aiResponse = aiResponse.replace(/^"(.*)"$/, '$1');
          // Display AI-generated response
          displayChat(userInput, aiResponse);
        } catch (error) {
          console.error("Error fetching AI response:", error);
          alert("Failed to generate a response. Please try again later.");
        }
      
        // Clear the input field after generating the response
        (document.getElementById('ai-input') as HTMLInputElement).value = '';
      });
    }

    // Function to display the chat component
    function displayChat(prompt: string, response: string) {
      const chatContainer = document.getElementById('chat-container') as HTMLElement;
      const promptText = document.getElementById('prompt-text') as HTMLElement;
      const responseText = document.getElementById('response-text') as HTMLElement;

      // Set the chat contents
      promptText.textContent = prompt;
      responseText.textContent = response;

      // Show the chat container and adjust modal height
      chatContainer.style.display = 'flex';
      const modalContent = document.getElementById('modal-content') as HTMLElement;
      modalContent.style.height = 'auto';
      modalContent.style.maxHeight = '500px';

      // Replace Generate button with Insert and Regenerate buttons
      const generateBtn = document.getElementById('generate-btn') as HTMLElement;
      generateBtn.outerHTML = `
        <div style="display: flex; gap: 10px; float: right; margin-top: 10px;">
    <button id="insert-btn" style="
        background-color: transparent;
        color: #cbd5e0;
        border: 2px solid #cbd5e0;
        padding: 7px 11px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 16px;
    ">Insert</button>
    
    <button id="regenerate-btn" style="
        background-color: #3B82F6;
        color: white;
        border: none;
        padding: 7px 11px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 16px;
    ">Regenerate</button>
</div>`;

      // Handle Insert Button Click
      document.getElementById('insert-btn')?.addEventListener('click', () => {
        const messageBox = document.querySelector('div.msg-form__contenteditable') as HTMLElement;
        const existingParagraph = messageBox.querySelector('p');

        if (existingParagraph) {
          existingParagraph.textContent = response; // Set the AI response
        } else {
          messageBox.innerHTML = `<p>${response}</p>`;
        }

        // Manually trigger an input event to update the placeholder state
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        messageBox.dispatchEvent(inputEvent);

        closeAIModal();
      });
    }

    // Function to close the modal
    function closeAIModal() {
      if (modal) {
        modal.remove();
        modal = null;
      }
    }

    // Observe message box focus to inject/remove AI icon
    const observer = new MutationObserver(() => {
      const messageBox = document.querySelector('div.msg-form__contenteditable');
      if (messageBox) {
        messageBox.addEventListener('focus', injectAIIcon);
        messageBox.addEventListener('blur', removeAIIcon);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
});
