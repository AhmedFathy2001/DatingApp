using API.Interfaces;

namespace API.Entities;

public class Media
{
    public int Id { get; set; }

    public string Url { get; set; }

    public string PublicId { get; set; }

    public MediaType Type { get; set; }
}