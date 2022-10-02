﻿using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedprMVC.Models;

public class FamilyModel
{
    public Guid Id { get; set; }
    [Required(ErrorMessage = "Surname is required")]
    [StringLength(15, MinimumLength = 2)]
    public string Surname { get; set; }
}