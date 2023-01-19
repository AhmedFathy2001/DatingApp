namespace API.Helpers;

public class UserParams : PaginationParams
{
    private string _searchByUsername;
    public string CurrentUsername { get; set; }
    public string Gender { get; set; }

    public int MinAge { get; set; } = 18;

    public int MaxAge { get; set; } = 100;

    public string OrderBy { get; set; } = "lastActive";


    public string SearchByUsername
    {
        get => _searchByUsername;
        set => _searchByUsername = value.ToLower();
    }
}