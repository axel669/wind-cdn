export default {
    fetch() {
        return new Response(
            "These are not the droids you are looking for",
            { status: 404 }
        )
    }
}
