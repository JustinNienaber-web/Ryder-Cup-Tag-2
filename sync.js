"use strict";

const SUPABASE_ZUSTAND = (() => {
    const client = supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey
    );

    async function ladeAlleMatches() {
        const { data, error } = await client
            .from("matches")
            .select("*")
            .order("match_number", { ascending: true });

        if (error) {
            throw new Error(`Matches konnten nicht geladen werden: ${error.message}`);
        }

        return data;
    }

    async function ladeMatch(matchNummer) {
        const { data, error } = await client
            .from("matches")
            .select("*")
            .eq("match_number", matchNummer)
            .single();

        if (error) {
            throw new Error(`Match ${matchNummer} konnte nicht geladen werden: ${error.message}`);
        }

        return data;
    }

    async function speichereMatch(matchNummer, bearbeitungsToken, zustand) {
        const { data, error } = await client.rpc("save_match_state", {
            p_match_number: matchNummer,
            p_edit_token: bearbeitungsToken,
            p_state: zustand,
        });

        if (error) {
            throw new Error(`Match ${matchNummer} konnte nicht gespeichert werden: ${error.message}`);
        }

        return data;
    }

    function beobachteMatches(beiAenderung) {
        return client
            .channel("ryder-cup-live")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "matches",
                },
                beiAenderung
            )
            .subscribe();
    }

    async function beendeBeobachtung(kanal) {
        if (kanal) {
            await client.removeChannel(kanal);
        }
    }

    return Object.freeze({
        ladeAlleMatches,
        ladeMatch,
        speichereMatch,
        beobachteMatches,
        beendeBeobachtung,
    });
})();
