function loadTransformationSkill() {
    // 1. Setup specific Q data
    const q = {
        coords: [[-1, -1], [-1, 1], [0, 0]],
        target: [[-3, 1], [-3, 3], [-2, 2]],
        cap: 180 // 3 minutes for this specific coordinate task
    };

    // 2. Update Hub variables
    currentQCap = q.cap;
    currentQSeconds = 0;
    currentQActive = true;

    // 3. Render the UI (Grid, buttons, etc.)
    renderGridUI(q);
}

async function recordScore(score) {
    // Update the specific column for this skill
    await SB_CLIENT.from('assignment')
        .update({ C6Transformation: score })
        .eq('userName', currentUser);
}
