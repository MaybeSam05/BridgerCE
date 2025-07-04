export async function authenticateUser(): Promise<void> {
    console.log("authenticateUser function called");
    
    // Check if we're in a Chrome extension environment
    if (typeof chrome === 'undefined' || !chrome.identity) {
      console.error("Chrome extension APIs not available. This function only works in a Chrome extension.");
      alert("This function only works in a Chrome extension. Please load this as an extension in Chrome.");
      return;
    }
    
    console.log("Chrome extension APIs are available, proceeding with authentication...");

    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Auth Error:", chrome.runtime.lastError);
        return;
      }
  
      console.log("OAuth Token:", token);
  
      try {
        // Get user's profile info (name and email)
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        if (!profileRes.ok) {
          const errorBody = await profileRes.text();
          throw new Error(`Profile request failed: ${profileRes.status} ${profileRes.statusText} - ${errorBody}`);
        }
  
        const profile = await profileRes.json();
        console.log("User Profile:", profile); // includes name and email
        
        // Extract the data you need
        const userEmail = profile.email;
        const userName = profile.name;
        
        console.log("User Email:", userEmail);
        console.log("User Name:", userName);
        
        // You can now use userEmail and userName for your application
        // For example, store them or use them to send emails later
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });
  }
  